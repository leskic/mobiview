# encoding: UTF-8

module MobiViewExporter

  module Inspector

    extend self

    ############################################################
    # Executa diagnóstico
    ############################################################

    def run(model)

      pieces = EntityWalker.walk(model)

      report = ""

      report << "=========================================\n"
      report << " MOBIVIEW INSPECTOR 2.0\n"
      report << "=========================================\n\n"

      report << "Projeto : #{model.title}\n"
      report << "Peças   : #{pieces.size}\n\n"

      pieces.each_with_index do |entity,index|

        report << piece_report(entity,index+1)

      end

      file = UI.savepanel(

        "Salvar Diagnóstico",

        "",

        "diagnostico_mobiview.txt"

      )

      return unless file

      File.open(file,"w:utf-8"){|f|

        f.write(report)

      }

      UI.messagebox(

        "Diagnóstico concluído."

      )

    end

    ############################################################
    # Relatório de uma peça
    ############################################################

    def piece_report(entity,index)

      text = ""

      text << "=================================================\n"

      text << "PEÇA #{index}\n"

      text << "=================================================\n"

      text << "Persistent ID : #{entity.persistent_id}\n"

      text << "Definition    : #{entity.definition.name}\n"

      text << "Código        : #{Utils.piece_code(entity)}\n"

      text << "Nome          : #{Utils.piece_name(entity)}\n"

      text << "Módulo        : #{Utils.module_id(entity)}\n"

      text << "Material      : #{Utils.material(entity)}\n\n"

      ##########################################################

      bbox = Utils.bounding_box(entity)

      text << "BOUNDING BOX\n"

      text << "X : #{bbox[:x]} mm\n"

      text << "Y : #{bbox[:y]} mm\n"

      text << "Z : #{bbox[:z]} mm\n\n"

      ##########################################################

      parser = DinaboxParser.parse(entity)

      if parser

        text << "DINABOX\n"

        text << "Tipo : #{parser[:type]}\n"

        text << "Raw  : #{parser[:raw]}\n\n"

        if parser[:parsed]

          parser[:parsed].each do |k,v|

            text << "#{k} = #{v}\n"

          end

        end

        text << "\n"

      else

        text << "DINABOX\n"

        text << "Sem dinabox_dados\n\n"

      end

      ##########################################################

      dict = Utils.dynamic_attributes(entity)

      if dict

        text << "DYNAMIC ATTRIBUTES\n\n"

        dict.each_pair do |k,v|

          text << "#{k} = #{v}\n"

        end

      end

      text << "\n\n"

      text

    end

  end

end