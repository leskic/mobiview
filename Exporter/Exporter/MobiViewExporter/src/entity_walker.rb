# encoding: UTF-8

module MobiViewExporter

  module EntityWalker

    extend self

    def walk(model)
      @pieces = []

      walk_entities(model.entities, Geom::Transformation.new, [])

      @pieces
    end

    def walk_entities(entities, parent_transform, definition_stack)
      entities.each do |entity|
        case entity
        when Sketchup::Group
          next if entity.deleted?

          world_transform = parent_transform * entity.transformation
          walk_entities(entity.entities, world_transform, definition_stack)

        when Sketchup::ComponentInstance
          process_component(entity, parent_transform, definition_stack)
        end
      end
    end

    def process_component(entity, parent_transform, definition_stack)
      return if entity.deleted?

      world_transform = parent_transform * entity.transformation

      if EntityFilter.valid_piece?(entity) && !container_component?(entity)
        @pieces << {
          entity: entity,
          world_transform: world_transform
        }
      end

      definition = entity.definition
      return unless definition

      # Protege contra componentes que contenham a própria definição.
      return if definition_stack.include?(definition.guid)

      entities = definition.entities
      return unless entities
      return if entities.count == 0

      walk_entities(
        entities,
        world_transform,
        definition_stack + [definition.guid]
      )
    end

    # Filtra somente contêineres genéricos chamados "Porta" que possuem
    # outras peças Dinabox dentro deles. Portas reais, sem filhos válidos,
    # continuam sendo exportadas normalmente.
    def container_component?(entity)
      name = Utils.piece_name(entity).to_s.strip
      return false unless normalize_name(name) == "porta"

      contains_valid_children?(entity)
    end

    def normalize_name(value)
      value.to_s
        .encode("UTF-8", invalid: :replace, undef: :replace, replace: "")
        .downcase
        .tr("áàâãäéèêëíìîïóòôõöúùûüç", "aaaaaeeeeiiiiooooouuuuc")
        .strip
    rescue
      value.to_s.downcase.strip
    end

    # Um componente Dinabox que contém outras peças válidas é um contêiner.
    def contains_valid_children?(entity)
      definition = entity.definition
      return false unless definition

      entities_contain_valid_piece?(definition.entities, [definition.guid])
    end

    def entities_contain_valid_piece?(entities, definition_stack)
      entities.any? do |child|
        next false if child.deleted?

        case child
        when Sketchup::Group
          entities_contain_valid_piece?(child.entities, definition_stack)

        when Sketchup::ComponentInstance
          next true if EntityFilter.valid_piece?(child)

          child_definition = child.definition
          next false unless child_definition
          next false if definition_stack.include?(child_definition.guid)

          entities_contain_valid_piece?(
            child_definition.entities,
            definition_stack + [child_definition.guid]
          )

        else
          false
        end
      end
    end

  end

end
