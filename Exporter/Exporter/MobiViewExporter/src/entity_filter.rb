# encoding: UTF-8

module MobiViewExporter

  module EntityFilter

    extend self

    ############################################################
    # É ComponentInstance?
    ############################################################

    def component?(entity)
      entity.is_a?(Sketchup::ComponentInstance)
    end

    ############################################################
    # Está oculto?
    ############################################################

    def hidden?(entity)
      return true if entity.hidden?

      layer = entity.layer
      return true if layer && !layer.visible?

      false
    end

    ############################################################
    # Dynamic Attributes
    ############################################################

    def dynamic?(entity)
      !Utils.dynamic_attributes(entity).nil?
    end

    ############################################################
    # Tem dinabox_dados?
    ############################################################

    def has_dinabox_data?(entity)
      value = Utils.get_attr(entity, "dinabox_dados")
      return false if value.nil?
      return false if value.to_s.strip.empty?
      true
    end

    ############################################################
    # Tem código?
    ############################################################

    def has_code?(entity)
      value = Utils.piece_code(entity)
      return false if value.nil?
      return false if value.to_s.strip.empty?
      true
    end

    ############################################################
    # Tem nome?
    ############################################################

    def has_name?(entity)
      value = Utils.piece_name(entity)
      return false if value.nil?
      return false if value.to_s.strip.empty?
      true
    end

    ############################################################
    # Tem módulo?
    ############################################################

    def has_module?(entity)
      value = Utils.module_id(entity)
      return false if value.nil?
      return false if value.to_s.strip.empty?
      true
    end

    ############################################################
    # Possui geometria em qualquer nível?
    ############################################################

    def has_geometry?(entity)
      definition = entity.definition
      return false unless definition

      entities_have_face?(definition.entities, [definition.guid])
    end

    def entities_have_face?(entities, definition_stack)
      entities.any? do |child|
        next false if child.deleted?
        next false if child.respond_to?(:hidden?) && child.hidden?

        case child
        when Sketchup::Face
          true

        when Sketchup::Group
          entities_have_face?(child.entities, definition_stack)

        when Sketchup::ComponentInstance
          child_definition = child.definition
          next false unless child_definition
          next false if definition_stack.include?(child_definition.guid)

          entities_have_face?(
            child_definition.entities,
            definition_stack + [child_definition.guid]
          )

        else
          false
        end
      end
    end

    ############################################################
    # É peça?
    ############################################################

    def valid_piece?(entity)
      return false unless component?(entity)
      return false if hidden?(entity)
      return false unless dynamic?(entity)
      return false unless has_code?(entity)
      return false unless has_name?(entity)
      return false unless has_geometry?(entity)

      true
    end

  end

end
